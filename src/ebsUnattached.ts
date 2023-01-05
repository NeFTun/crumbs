import * as AWS from "@aws-sdk/client-pricing";

import ebsUnattached from '../output/ebs-unattached/resources.json';

const client = new AWS.Pricing({ region: "us-east-1" });

export type VolumeTypePricing = {
  volumeType: string,
  sizeInGB: number,
  pricePerGB: string,
}

export async function getReport(region: string): Promise<VolumeTypePricing[] | undefined> {
  if (ebsUnattached.length === 0) {
    return;
  }

  const volumeTypesDist = getVolumeTypeDistribution(ebsUnattached);
  const instTypePricing: VolumeTypePricing[] = [];

  for (const [volumeType, sizeInGB] of Object.entries(volumeTypesDist)) {
    const pricePerGB = await fetchPrice(region, volumeType);

    if (pricePerGB !== undefined) {
      instTypePricing.push({
        volumeType,
        sizeInGB,
        pricePerGB,
      });
    }
  }

  return instTypePricing;
}

/**
 * Get map of (volume type => size in GB)
 * @param ebsUnattached 
 * @returns 
 */
function getVolumeTypeDistribution(ebsUnattached: any): { [volumeType: string]: number } {
  const result: { [volumeType: string]: number } = {};

  for (const resource of ebsUnattached) {
    if (result[resource.VolumeType] === undefined) {
      result[resource.VolumeType] = resource.Size;
    } else {
      result[resource.VolumeType] += resource.Size;
    }
  }

  return result;
}

async function fetchPrice(region: string, volumeApiName: string): Promise<string | undefined> {
  try {
    const data = await client.getProducts({
      ServiceCode: "AmazonEC2",
      Filters: [
        {
          'Type': 'TERM_MATCH',
          'Field': 'productFamily',
          'Value': 'Storage'
        },
        {
          'Type': 'TERM_MATCH',
          Field: 'regionCode',
          'Value': region
        },
        {
          'Type': 'TERM_MATCH',
          'Field': 'volumeApiName',
          'Value': volumeApiName
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
