FROM intel/intel-optimized-pytorch
# FROM tensorflow/tensorflow:2.4.1

# Prepare work directory.
RUN mkdir /mini-dnabert
WORKDIR /mini-dnabert

# Add the ML model.
COPY model/ ./model

#Add our python script.
COPY timing_predict.py .

#Add our requirements
COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# The prescribed way to use this image is to invoke predict.py with arbitrary parameters.
ENTRYPOINT ["python", "timing_predict.py"]
