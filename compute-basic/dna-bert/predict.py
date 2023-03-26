# import torch
# import transformers
# import numpy
# import csv
# from transformers import DistilBertForSequenceClassification
# from transformers import AutoTokenizer
import sys
import os

# read cmdline parameters & do error checking
input_path = sys.argv[1]
output_path = sys.argv[2]
# except IndexError:
#     print("Usage: " + os.path.basename(__file__) + " <input_path> <output_path>")
#     sys.exit(1)
# if not input_path.endswith('.csv'):
#     print("<input_path> must be a .csv file")
#     sys.exit(1)

#load the model
# model = DistilBertForSequenceClassification.from_pretrained('model/')
# model.eval()
# tokenizer = AutoTokenizer.from_pretrained('model/')

# #create classification label
# classifications = ["PROXIMAL", "CORE"]

# #load the user input
# file = open((input_path), "r")
# reader = csv.reader(file, delimiter=',')
# predictions = []
# sequence_count = 0
# for row in reader:
#     if sequence_count < 100:
#         encoding = tokenizer.encode(row[0], return_tensors='pt')
#         input_ids = encoding 
#         attention_mask = torch.ones(input_ids.shape)
#         output = model(input_ids=input_ids, attention_mask=attention_mask)[0]
#         output = torch.nn.functional.softmax(model(input_ids=input_ids, attention_mask=attention_mask)[0], dim=-1)
#         classification = output.argmax(dim=-1).item()
#         class_name = classifications[classification]
#         predictions.append((f"This might be an input sequence from a {class_name} promoter region.\n"))
#         sequence_count=sequence_count+1
#     else:
#         print('sequence_count < 100 ')
#         exit
    
with open(output_path, 'w') as f:
        # f.writelines(predictions)
        f.write("hello world!")


