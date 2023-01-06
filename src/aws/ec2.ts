import * as AWS from "@aws-sdk/client-pricing";

import resources from '../../output/ec2-underutilized/resources.json';

const client = new AWS.Pricing({ region: "us-east-1" });

export type InstanceTypePricing = {
  instanceType: string,
  count: number,
  pricePerInstance: string,
}

export async function getReport(region: string): Promise<InstanceTypePricing[] | undefined> {
  if (resources.length === 0) {
    return;
  }

  // @ts-ignore
  const instanceTypesDist = getInstanceTypeDistribution(resources.map(resource => resource.InstanceType));
  const instTypePricing: InstanceTypePricing[] = [];

  for (const [instanceType, count] of Object.entries(instanceTypesDist)) {
    const instancePrice = await fetchPrice(region, instanceType);

    if (instancePrice !== undefined) {
      instTypePricing.push({
        instanceType,
        count,
        pricePerInstance: instancePrice
      });
    }
  }

  return instTypePricing;
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

async function fetchPrice(region: string, instanceType: string): Promise<string | undefined> {
  try {
    const data = await client.getProducts({
      ServiceCode: "AmazonEC2",
      Filters: [
        {
          'Type': 'TERM_MATCH',
          Field: 'regionCode',
          'Value': region
        },
        {
          'Type': 'TERM_MATCH',
          'Field': 'instanceType',
          'Value': instanceType
        },
        {
          'Type': 'TERM_MATCH',
          'Field': 'capacitystatus',
          'Value': 'Used'
        },
        {
          'Type': 'TERM_MATCH',
          'Field': 'tenancy',
          'Value': 'Shared'
        },
        {
          'Type': 'TERM_MATCH',
          'Field': 'preInstalledSw',
          'Value': 'NA'
        },
        {
          'Type': 'TERM_MATCH',
          'Field': 'operatingSystem',
          'Value': 'Linux'
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
    console.error(`fetchPrice: ${error}`);
  }
}
