FROM ubuntu:16.04

# Let's start with some basic stuff.
RUN apt-get update -qq && apt-get install -qqy \
	apt-transport-https \
	ca-certificates \
	curl \
	git \
	iptables \
	libxext-dev libxrender-dev libxtst-dev \
	software-properties-common \
	ssh-askpass \
	unzip \
  vim \
	wget \
	zip

# Install nodejs
Run curl -sL https://deb.nodesource.com/setup_8.x | bash - && \
    apt-get install -y nodejs
# Install google-cloud-sdk
RUN export CLOUD_SDK_REPO="cloud-sdk-$(lsb_release -c -s)" && \
    echo "deb http://packages.cloud.google.com/apt $CLOUD_SDK_REPO main" | tee -a /etc/apt/sources.list.d/google-cloud-sdk.list && \
    curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add - && \
    apt-get update && apt-get install -y google-cloud-sdk

# Install Docker from Docker Inc. repositories.
ARG DOCKER_VERSION=17.12.0~ce-0~ubuntu
RUN curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add - && \
    apt-key fingerprint 0EBFCD88 && add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" && \
    apt-get update && apt-get install -y docker-ce=${DOCKER_VERSION}

# Install firebase-tools
RUN npm install -g firebase-tools yarn
