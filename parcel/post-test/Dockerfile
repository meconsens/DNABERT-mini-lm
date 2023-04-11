FROM python:3.12-rc-buster
# FROM tensorflow/tensorflow:2.4.1

# Prepare work directory.
RUN mkdir /post-request
WORKDIR /post-request

# Add the ML model.

#Add our python script.
COPY ping.py .

#Add our requirements


# The prescribed way to use this image is to invoke predict.py with arbitrary parameters.
ENTRYPOINT ["python", "ping.py"]
