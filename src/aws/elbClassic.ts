import * as AWS from "@aws-sdk/client-pricing";

import resources from '../../output/elb-classic-unused/resources.json';

const client = new AWS.Pricing({ region: "us-east-1" });

export type ELBClassicPricing = {
  numberOfELBs: number,
  price: string,
}

export async function getReport(region: string): Promise<ELBClassicPricing | undefined> {
  if (resources.length === 0) {
    return;
  }

  return {
    numberOfELBs: resources.length,
    price: await fetchPrice(region) as string
  };
}

async function fetchPrice(region: string): Promise<string | undefined> {
  try {
    const data = await client.getProducts({
      ServiceCode: "AmazonEC2",
      Filters: [
        {
          'Type': 'TERM_MATCH',
          'Field': 'productFamily',
          'Value': 'Load Balancer'
        },
        {
          'Type': 'TERM_MATCH',
          Field: 'regionCode',
          'Value': region
        },
        {
          'Type': 'TERM_MATCH',
          Field: 'usagetype',
          'Value': 'LoadBalancerUsage'
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
  } catch (error) {
    console.error(`fetchPrice: ${error}`);
  }
}
