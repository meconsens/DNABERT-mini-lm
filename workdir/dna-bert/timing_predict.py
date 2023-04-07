#WRITTEN FOR GOOGLE COLAB:
input_paths = ['sequence_sample_1.csv', 'sequence_sample_5.csv', 'sequence_sample_20.csv', 'sequence_sample_100.csv']
for input_path in input_paths:
  import torch
  import csv
  from transformers import DistilBertForSequenceClassification
  from transformers import AutoTokenizer
  import sys
  import time
  start_time = time.time()
  # import os

  # read cmdline parameters & do error checking
  output_path = f'output'+input_path+'.txt'

  # output_path = '/parcel/data/out/prediction.txt'
  # except IndexError:
  #     print("Usage: " + os.path.basename(__file__) + " <input_path> <output_path>")
  #     sys.exit(1)
  # if not input_path.endswith('.csv'):
  #     print("<input_path> must be a .csv file")
  #     sys.exit(1)

  #load the model
  model = DistilBertForSequenceClassification.from_pretrained('model/')
  model.eval()
  tokenizer = AutoTokenizer.from_pretrained('model/')

  #create classification label
  classifications = ["PROXIMAL", "CORE"]

  #load the user input
  file = open((input_path), "r")
  reader = csv.reader(file, delimiter=',')
  predictions = []
  sequence_count = 0
  for row in reader:
      if sequence_count < 100:
          encoding = tokenizer.encode(row[0], return_tensors='pt')
          input_ids = encoding 
          attention_mask = torch.ones(input_ids.shape)
          output = model(input_ids=input_ids, attention_mask=attention_mask)[0]
          output = torch.nn.functional.softmax(model(input_ids=input_ids, attention_mask=attention_mask)[0], dim=-1)
          classification = output.argmax(dim=-1).item()
          class_name = classifications[classification]
          predictions.append((f"This might be an input sequence from a {class_name} promoter region.\n"))
          sequence_count=sequence_count+1
      else:
          print('sequence_count < 100 ')
          exit

  # line = 'CACAGC ACAGCC CAGCCA AGCCAG GCCAGC CCAGCC CAGCCA AGCCAC GCCACT CCACTA CACTAG ACTAGG CTAGGC TAGGCC AGGCCC GGCCCT GCCCTG CCCTGT CCTGTC CTGTCC TGTCCT GTCCTG TCCTGC CCTGCA CTGCAG TGCAGC GCAGCC CAGCCC AGCCCC GCCCCC CCCCCT CCCCTG CCCTGT CCTGTA CTGTAG TGTAGG GTAGGG TAGGGG AGGGGT GGGGTC GGGTCT GGTCTG GTCTGG TCTGGA CTGGAA TGGAAC GGAACA GAACAG AACAGC ACAGCC CAGCCA AGCCAG GCCAGG CCAGGA CAGGAG AGGAGT GGAGTG GAGTGG AGTGGT GTGGTT TGGTTT GGTTTA GTTTAA TTTAAG TTAAGA TAAGAG AAGAGG AGAGGC GAGGCA AGGCAG GGCAGG GCAGGG CAGGGG AGGGGA GGGGAG GGGAGT GGAGTC GAGTCG AGTCGC GTCGCC TCGCCT CGCCTT GCCTTG CCTTGC CTTGCC TTGCCC TGCCCT GCCCTG CCCTGT CCTGTG CTGTGC TGTGCC GTGCCA TGCCAC GCCACA CCACAC'
  # encoding = tokenizer.encode(line, return_tensors='pt')
  # input_ids = encoding 
  # attention_mask = torch.ones(input_ids.shape)
  # output = model(input_ids=input_ids, attention_mask=attention_mask)[0]
  # output = torch.nn.functional.softmax(model(input_ids=input_ids, attention_mask=attention_mask)[0], dim=-1)
  # classification = output.argmax(dim=-1).item()
  # class_name = classifications[classification]
  # predictions.append((f"This might be an input sequence from a {class_name} promoter region.\n"))
  # sequence_count=sequence_count+1
      
  with open(output_path, 'w') as f:
          # f.write(f"this is the input path:{input_path}\n")
          # f.write(f"this is the output path:{output_path}\n")
          f.writelines(predictions)

  print("--- %s seconds ---" % (time.time() - start_time))

