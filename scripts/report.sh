#!/bin/bash

docker pull cloudcustodian/c7n

rm -r output/
mkdir output

docker run -it \
  -v $(pwd)/output:/home/custodian/output \
  -v $(pwd)/policy.yml:/home/custodian/policy.yml \
  -v $(cd ~ && pwd)/.aws/credentials:/home/custodian/.aws/credentials \
  -v $(cd ~ && pwd)/.aws/config:/home/custodian/.aws/config \
  --env-file <(env | grep "^AWS") \
  cloudcustodian/c7n run --dryrun --cache-period 0 -s /home/custodian/output /home/custodian/policy.yml

npm run build && ts-node src/index.ts
