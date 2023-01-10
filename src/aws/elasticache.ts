import * as AWS from "@aws-sdk/client-pricing";

import resources from '../../output/orz/us-east-1/elasticache-cluster-unused/resources.json';

const client = new AWS.Pricing({ region: "us-east-1" });

export type ClusterPricing = {
  engine: string,
  instanceType: string,
  numberOfNodes: number,
  pricePerNode: string,
}

export async function getReport(region: string): Promise<ClusterPricing[] | undefined> {
  if (resources.length === 0) {
    return;
  }

  const clusterPricing: ClusterPricing[] = [];

  for (const resource of resources) {
    const nodePrice = await fetchPrice(region, resource['Engine'], resource['CacheNodeType']);

    clusterPricing.push({
      engine: resource['Engine'],
      instanceType: resource['CacheNodeType'],
      numberOfNodes: resource['NumCacheNodes'],
      pricePerNode: nodePrice as string
    })
  }

  return clusterPricing;
}

async function fetchPrice(region: string, cacheEngine: string, instanceType: string): Promise<string | undefined> {
  try {
    const data = await client.getProducts({
      ServiceCode: "AmazonElastiCache",
      Filters: [
        {
          'Type': 'TERM_MATCH',
          Field: 'productFamily',
          'Value': 'Cache Instance'
        },
        {
          'Type': 'TERM_MATCH',
          Field: 'regionCode',
          'Value': region
        },
        {
          'Type': 'TERM_MATCH',
          Field: 'cacheEngine',
          'Value': cacheEngine
        },
        {
          'Type': 'TERM_MATCH',
          Field: 'instanceType',
          'Value': instanceType
        },
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
  } catch (error) {
    console.error(`fetchPrice: ${error}`);
  }
}
