# syntax=docker/dockerfile:1.7
# ws-scrcpy (https://github.com/NetrisTV/ws-scrcpy, MIT) built from one pinned upstream commit: the browser screen
# of the redroid app (apps/redroid). Upstream publishes no image; third-party rebuilds have no known provenance, and
# this container drives adb, which is root inside a privileged Android container. Built and pushed to
# ghcr.io/carlosalaniz/ws-scrcpy by .github/workflows/images.yml; apps pin the pushed digest.
ARG NODE=22-bookworm

FROM node:${NODE} AS build
ARG WS_SCRCPY_COMMIT
RUN test -n "$WS_SCRCPY_COMMIT"
WORKDIR /src
RUN git init -q . \
 && git remote add origin https://github.com/NetrisTV/ws-scrcpy.git \
 && git fetch -q --depth 1 origin "$WS_SCRCPY_COMMIT" \
 && git checkout -q FETCH_HEAD \
 && test "$(git rev-parse HEAD)" = "$WS_SCRCPY_COMMIT"
# iOS support (appium, an optional dependency) is not built in (INCLUDE_APPL is false upstream)
RUN npm ci --omit=optional --no-audit --no-fund && npm run dist
WORKDIR /src/dist
RUN npm install --omit=dev --omit=optional --no-audit --no-fund

FROM node:${NODE}-slim
ARG WS_SCRCPY_COMMIT
RUN apt-get update \
 && apt-get install -y --no-install-recommends adb tini \
 && rm -rf /var/lib/apt/lists/*
COPY --from=build /src/dist /app
COPY entrypoint.sh /usr/local/bin/ws-scrcpy-entrypoint
LABEL org.opencontainers.image.source="https://github.com/carlosalaniz/harbor-apps" \
      org.opencontainers.image.description="ws-scrcpy (NetrisTV) for Harbor's redroid app" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.revision="${WS_SCRCPY_COMMIT}"
USER node
WORKDIR /app
ENV HOME=/home/node
EXPOSE 8000
ENTRYPOINT ["/usr/bin/tini", "--", "/usr/local/bin/ws-scrcpy-entrypoint"]
