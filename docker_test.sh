docker run --rm --name dna-bert-tester \
-v $(pwd)/dna-bert:/parcel \
  dna-bert \
  /parcel/sequences/sequence_sample.csv /parcel/output/prediction.txt
