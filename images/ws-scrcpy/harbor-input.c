// harbor-input: the browser screen's taps and keys as hardware input. Some apps ignore input that Android marks as
// injected by a virtual device (WhatsApp's registration screen does), which is what scrcpy and `adb shell input` send.
// This daemon runs as root inside the Android container (the screen container pushes and starts it over adb), creates
// a touchscreen and a keyboard through /dev/uinput and replays line commands from ws-scrcpy's server:
//   d <slot> <x> <y>   finger down at x,y (0..32767 across the display)
//   m <slot> <x> <y>   finger moves
//   u <slot>           finger up
//   k <code> <1|0>     Linux key code pressed / released
// It listens on TCP <port> on every interface of the app's private network (nothing publishes it).
// A container gets no device events, so it makes the /dev/input nodes itself, with the label, group and mode
// Android's EventHub needs the moment the node appears (EventHub does not retry).
#include <dirent.h>
#include <errno.h>
#include <fcntl.h>
#include <linux/uinput.h>
#include <netinet/in.h>
#include <poll.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/ioctl.h>
#include <sys/socket.h>
#include <sys/stat.h>
#include <sys/sysmacros.h>
#include <unistd.h>

#define SLOTS 10
#define MAXC 8
#define AXIS 32767

static int ts = -1, kb = -1;
static char nodes[4][64];
static int nnodes;
static int tracking[SLOTS]; // tracking id per slot, -1 = up
static int next_id = 1;

static void emit(int fd, int type, int code, int val) {
  struct input_event ie;
  memset(&ie, 0, sizeof ie);
  ie.type = type;
  ie.code = code;
  ie.value = val;
  if (write(fd, &ie, sizeof ie) < 0) perror("write");
}

static void make_node(int fd) {
  char sys[64] = {0}, dir[256];
  if (ioctl(fd, UI_GET_SYSNAME(sizeof sys), sys) < 0) return;
  snprintf(dir, sizeof dir, "/sys/devices/virtual/input/%s", sys);
  DIR *d = opendir(dir);
  if (!d) return;
  struct dirent *e;
  while ((e = readdir(d))) {
    if (strncmp(e->d_name, "event", 5)) continue;
    char p[512];
    int ma, mi;
    snprintf(p, sizeof p, "%s/%s/dev", dir, e->d_name);
    FILE *f = fopen(p, "r");
    if (f && fscanf(f, "%d:%d", &ma, &mi) == 2 && nnodes < 4) {
      char *node = nodes[nnodes++];
      snprintf(node, 64, "/dev/input/%s", e->d_name);
      mkdir("/dev/input", 0755);
      unlink(node);
      int fc = open("/proc/self/attr/fscreate", O_WRONLY);
      if (fc >= 0) {
        const char *l = "u:object_r:input_device:s0";
        if (write(fc, l, strlen(l)) < 0) perror("fscreate");
        close(fc);
      }
      umask(0);
      if (setegid(1004) < 0) perror("setegid"); // group input
      if (mknod(node, S_IFCHR | 0660, makedev(ma, mi)) < 0) perror(node);
      if (setegid(0) < 0) perror("setegid");
    }
    if (f) fclose(f);
  }
  closedir(d);
}

static int make_device(const char *name, int touch) {
  int fd = open("/dev/uinput", O_WRONLY | O_NONBLOCK);
  if (fd < 0) {
    perror("/dev/uinput");
    exit(1);
  }
  ioctl(fd, UI_SET_EVBIT, EV_KEY);
  ioctl(fd, UI_SET_EVBIT, EV_SYN);
  struct uinput_user_dev u;
  memset(&u, 0, sizeof u);
  snprintf(u.name, sizeof u.name, "%s", name);
  u.id.bustype = BUS_USB;
  u.id.vendor = 0x1209; // pid.codes open-source vendor id
  u.id.product = touch ? 0x4801 : 0x4802;
  u.id.version = 1;
  if (touch) {
    ioctl(fd, UI_SET_EVBIT, EV_ABS);
    ioctl(fd, UI_SET_KEYBIT, BTN_TOUCH);
    int abs[] = {ABS_MT_SLOT, ABS_MT_TRACKING_ID, ABS_MT_POSITION_X, ABS_MT_POSITION_Y};
    for (int i = 0; i < 4; i++) ioctl(fd, UI_SET_ABSBIT, abs[i]);
    ioctl(fd, UI_SET_PROPBIT, INPUT_PROP_DIRECT);
    u.absmax[ABS_MT_SLOT] = SLOTS - 1;
    u.absmax[ABS_MT_TRACKING_ID] = 65535;
    u.absmax[ABS_MT_POSITION_X] = AXIS;
    u.absmax[ABS_MT_POSITION_Y] = AXIS;
  } else {
    for (int k = 1; k < 249; k++) ioctl(fd, UI_SET_KEYBIT, k);
  }
  if (write(fd, &u, sizeof u) < 0 || ioctl(fd, UI_DEV_CREATE) < 0) {
    perror("uinput create");
    exit(1);
  }
  make_node(fd);
  return fd;
}

static void cleanup(int sig) {
  (void)sig;
  if (ts >= 0) ioctl(ts, UI_DEV_DESTROY);
  if (kb >= 0) ioctl(kb, UI_DEV_DESTROY);
  for (int i = 0; i < nnodes; i++) unlink(nodes[i]);
  _exit(0);
}

static int active(void) {
  int n = 0;
  for (int i = 0; i < SLOTS; i++) n += tracking[i] >= 0;
  return n;
}

static void command(char *line) {
  int s, x, y, code, v;
  if (sscanf(line, "d %d %d %d", &s, &x, &y) == 3 && s >= 0 && s < SLOTS) {
    int first = active() == 0;
    emit(ts, EV_ABS, ABS_MT_SLOT, s);
    if (tracking[s] < 0) {
      tracking[s] = next_id++ & 0xffff;
      emit(ts, EV_ABS, ABS_MT_TRACKING_ID, tracking[s]);
    }
    emit(ts, EV_ABS, ABS_MT_POSITION_X, x);
    emit(ts, EV_ABS, ABS_MT_POSITION_Y, y);
    if (first) emit(ts, EV_KEY, BTN_TOUCH, 1);
    emit(ts, EV_SYN, SYN_REPORT, 0);
  } else if (sscanf(line, "m %d %d %d", &s, &x, &y) == 3 && s >= 0 && s < SLOTS && tracking[s] >= 0) {
    emit(ts, EV_ABS, ABS_MT_SLOT, s);
    emit(ts, EV_ABS, ABS_MT_POSITION_X, x);
    emit(ts, EV_ABS, ABS_MT_POSITION_Y, y);
    emit(ts, EV_SYN, SYN_REPORT, 0);
  } else if (sscanf(line, "u %d", &s) == 1 && s >= 0 && s < SLOTS && tracking[s] >= 0) {
    emit(ts, EV_ABS, ABS_MT_SLOT, s);
    emit(ts, EV_ABS, ABS_MT_TRACKING_ID, -1);
    tracking[s] = -1;
    if (active() == 0) emit(ts, EV_KEY, BTN_TOUCH, 0);
    emit(ts, EV_SYN, SYN_REPORT, 0);
  } else if (sscanf(line, "k %d %d", &code, &v) == 2 && code > 0 && code < 249) {
    emit(kb, EV_KEY, code, v ? 1 : 0);
    emit(kb, EV_SYN, SYN_REPORT, 0);
  }
}

// every finger a client left down goes up, so a closed browser tab never leaves a stuck touch
static void release_all(void) {
  for (int s = 0; s < SLOTS; s++)
    if (tracking[s] >= 0) {
      char c[16];
      snprintf(c, sizeof c, "u %d", s);
      command(c);
    }
}

int main(int argc, char **argv) {
  int port = argc > 1 ? atoi(argv[1]) : 7008;
  for (int i = 0; i < SLOTS; i++) tracking[i] = -1;
  signal(SIGTERM, cleanup);
  signal(SIGINT, cleanup);
  signal(SIGPIPE, SIG_IGN);
  ts = make_device("Harbor Touchscreen", 1);
  kb = make_device("Harbor Keyboard", 0);
  // a hardware keyboard hides the on-screen one by default: keep it, for people on a phone
  if (system("settings put secure show_ime_with_hard_keyboard 1 >/dev/null 2>&1") != 0) fprintf(stderr, "settings failed\n");

  int srv = socket(AF_INET, SOCK_STREAM, 0), one = 1;
  setsockopt(srv, SOL_SOCKET, SO_REUSEADDR, &one, sizeof one);
  struct sockaddr_in a;
  memset(&a, 0, sizeof a);
  a.sin_family = AF_INET;
  a.sin_port = htons(port);
  a.sin_addr.s_addr = htonl(INADDR_ANY);
  if (bind(srv, (struct sockaddr *)&a, sizeof a) < 0 || listen(srv, 4) < 0) {
    perror("listen");
    cleanup(0);
  }
  fprintf(stderr, "harbor-input: listening on %d\n", port);
  struct pollfd p[MAXC + 1];
  char buf[MAXC][512];
  int len[MAXC];
  int nc = 0;
  p[0].fd = srv;
  p[0].events = POLLIN;
  for (;;) {
    if (poll(p, nc + 1, -1) < 0 && errno != EINTR) break;
    if (p[0].revents & POLLIN) {
      int c = accept(srv, NULL, NULL);
      if (c >= 0 && nc < MAXC) {
        p[nc + 1].fd = c;
        p[nc + 1].events = POLLIN;
        len[nc] = 0;
        nc++;
      } else if (c >= 0) close(c);
    }
    for (int i = 0; i < nc; i++) {
      if (!(p[i + 1].revents & (POLLIN | POLLHUP | POLLERR))) continue;
      int r = read(p[i + 1].fd, buf[i] + len[i], sizeof buf[i] - 1 - len[i]);
      if (r <= 0) {
        close(p[i + 1].fd);
        release_all();
        p[i + 1] = p[nc];
        memcpy(buf[i], buf[nc - 1], len[nc - 1]);
        len[i] = len[nc - 1];
        nc--;
        i--;
        continue;
      }
      len[i] += r;
      buf[i][len[i]] = 0;
      char *start = buf[i], *nl;
      while ((nl = strchr(start, '\n'))) {
        *nl = 0;
        command(start);
        start = nl + 1;
      }
      len[i] -= start - buf[i];
      memmove(buf[i], start, len[i]);
      if (len[i] >= (int)sizeof buf[i] - 1) len[i] = 0; // a line too long: drop it
    }
  }
  cleanup(0);
  return 0;
}
