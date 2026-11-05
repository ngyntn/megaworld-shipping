FROM python:3.12-slim-bookworm AS build
WORKDIR /app
COPY pocketbase.lock.json ./
COPY scripts/install.py ./scripts/install.py
RUN python scripts/install.py

FROM python:3.12-slim-bookworm
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 TZ=UTC
WORKDIR /app
RUN groupadd --gid 10001 pocketbase && useradd --uid 10001 --gid pocketbase --no-create-home pocketbase \
    && mkdir /data && chown pocketbase:pocketbase /data
COPY --from=build /app/bin/pocketbase ./bin/pocketbase
COPY scripts/ ./scripts/
COPY pb_hooks/ ./pb_hooks/
COPY pb_migrations/ ./pb_migrations/
COPY seed/ ./seed/
COPY pocketbase.lock.json ./
USER 10001:10001
EXPOSE 8090
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8090/api/health', timeout=3)"
ENTRYPOINT ["python", "/app/scripts/container.py"]
CMD ["serve"]
