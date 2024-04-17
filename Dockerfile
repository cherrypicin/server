FROM denoland/deno

EXPOSE 8000

WORKDIR /app

USER deno

ADD . /app

COPY . .

CMD ["run", "--allow-net","--allow-read","--allow-env", "--allow-sys=osRelease", "-A", "app/main-server.ts"]
