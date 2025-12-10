FROM node:20-bookworm

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    python3 python3-pip \
    g++ \
    openjdk-17-jdk-headless \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

USER node

CMD ["bash"]
