docker build -t $1 dna-bert-timer
x=$(docker images -q $1)
docker tag $x mattchoi531/$1
docker push mattchoi531/$1