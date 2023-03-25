FROM pytorch/pytorch:latest

# Prepare work directory.
RUN mkdir /mini-dnabert
WORKDIR /mini-dnabert

# Add the ML model.
ADD model/ ./model

#Add test sequences
ADD sequences/ ./sequences

#Create output directory
ADD output/ ./output

#Add our python script.
COPY predict.py .

#Add our requirements
COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# The prescribed way to use this image is to invoke predict.py with arbitrary parameters.
ENTRYPOINT ["python", "predict.py"]
