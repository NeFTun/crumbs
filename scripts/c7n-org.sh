#!/bin/bash

docker pull cloudcustodian/c7n-org

rm -r output/
mkdir output

# Search for orphan resources
docker run -it \
  -v $(pwd)/accounts.yml:/home/custodian/accounts.yml \
  -v $(pwd)/output:/home/custodian/output \
  -v $(pwd)/policy.yml:/home/custodian/policy.yml \
  cloudcustodian/c7n-org run --dryrun --cache-period 0 -c /home/custodian/accounts.yml -s s3://neftun-test/ -u /home/custodian/policy.yml
