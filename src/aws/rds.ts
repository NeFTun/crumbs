import * as AWS from "@aws-sdk/client-pricing";

import resources from '../../output/orz/us-east-1/rds-unused/resources.json'; 

const client = new AWS.Pricing({ region: "us-east-1" });

// TODO: Support more values
const ENGINE_VERSION_MAP: { [engine: string]: string } = {
  mysql: '5'
};

export type DBPricing = {
  DBInstanceId: string,
  price: number,
}

export async function getReport(region: string): Promise<DBPricing[] | undefined> {
  if (resources.length === 0) {
    return;
  }

  const dbPricing: DBPricing[] = [];

  for (const resource of resources) {
    const instancePrice = await fetchInstancePrice(region, resource['DBInstanceClass'], resource['MultiAZ'], resource['Engine']);
    const storagePrice = await fetchStoragePrice(region, resource['MultiAZ'], resource['Engine']);

    dbPricing.push({
      DBInstanceId: resource['DBInstanceIdentifier'],
      price: parseFloat(instancePrice as string) + parseFloat(storagePrice as string)
    })
  }

  return dbPricing;
}

function getInstanceTypeDistribution(instanceTypes: string[]): { [instanceType: string]: number } {
  const result: { [instanceType: string]: number } = {};

  for (const elem of instanceTypes) {
    if (result[elem] === undefined) {
      result[elem] = 1;
    } else {
      result[elem]++;
    }
  }

  return result;
}

async function fetchInstancePrice(region: string, instanceType: string, isMultiAZ: boolean, engine: string): Promise<string | undefined> {
  try {
    const data = await client.getProducts({
      ServiceCode: "AmazonRDS",
      Filters: [
        {
          'Type': 'TERM_MATCH',
          Field: 'productFamily',
          'Value': 'Database Instance'
        },
        {
          'Type': 'TERM_MATCH',
          Field: 'regionCode',
          'Value': region
        },
        {
          'Type': 'TERM_MATCH',
          Field: 'instanceType',
          'Value': instanceType
        },
        // TODO: Support more values
        {
          'Type': 'TERM_MATCH',
          Field: 'deploymentOption',
          'Value': isMultiAZ ? 'Multi-AZ' : 'Single-AZ'
        },
        {
          'Type': 'TERM_MATCH',
          Field: 'engineCode',
          'Value': ENGINE_VERSION_MAP[engine]
        }
      ]
    });

    // @ts-ignore
    const priceList = JSON.parse(data.PriceList);

    for (const [_, value] of Object.entries(priceList.terms.OnDemand)) {
      // @ts-ignore
      for (const [_, nestedValue] of Object.entries(value.priceDimensions)) {
        // @ts-ignore
        return nestedValue.pricePerUnit.USD;
      }
    }
    // process data.
  } catch (error) {
    console.error(`fetchInstancePrice: ${error}`);
  }
}

async function fetchStoragePrice(region: string, isMultiAZ: boolean, engine: string): Promise<string | undefined> {
  try {
    const data = await client.getProducts({
      ServiceCode: "AmazonRDS",
      Filters: [
        {
          'Type': 'TERM_MATCH',
          Field: 'productFamily',
          'Value': 'Database Storage'
        },
        {
          'Type': 'TERM_MATCH',
          Field: 'regionCode',
          'Value': region
        },
        {
          'Type': 'TERM_MATCH',
          Field: 'engineCode',
          'Value': ENGINE_VERSION_MAP[engine]
        },
        {
          'Type': 'TERM_MATCH',
          Field: 'deploymentOption',
          'Value': isMultiAZ ? 'Multi-AZ' : 'Single-AZ'
        },
        // TODO: Support more values
        {
          'Type': 'TERM_MATCH',
          Field: 'volumeType',
          'Value': 'General Purpose'
        }
      ]
    });

    // @ts-ignore
    const priceList = JSON.parse(data.PriceList);

    for (const [_, value] of Object.entries(priceList.terms.OnDemand)) {
      // @ts-ignore
      for (const [_, nestedValue] of Object.entries(value.priceDimensions)) {
        // @ts-ignore
        return nestedValue.pricePerUnit.USD;
      }
    }
    // process data.
  } catch (error) {
    console.error(`fetchStoragePrice: ${error}`);
  }
}
