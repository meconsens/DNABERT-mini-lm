docker run --rm --name dna-bert-tester \
-v $(pwd)/dna-bert/test_workdir:/parcel \
  test1124 \
  /parcel/data/in/sequence_sample.csv /parcel/data/out/prediction.txt
