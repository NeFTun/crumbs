import * as ec2Underutilized from "./ec2Underutilized";
import * as ebsUnattached from "./ebsUnattached";

const REGION = 'us-east-1';

(async () => {
  // EC2
  const ec2Report = await ec2Underutilized.getReport(REGION);
  if (ec2Report !== undefined) {
    console.log('***EC2 Costs***');

    const ec2HourlyCost = ec2Report.reduce((accumulator: number, currentValue: ec2Underutilized.InstanceTypePricing) => {
      console.log(`Instance type: ${currentValue.instanceType} => ${parseFloat(currentValue.pricePerInstance) * currentValue.count}$`);

      return accumulator + (parseFloat(currentValue.pricePerInstance) * currentValue.count);
    }, 0);
   
    console.log(`Total monthly cost: ${ec2HourlyCost * 24 * 30}$`);
  }

  // EBS
  const ebsReport = await ebsUnattached.getReport(REGION);
  if (ebsReport !== undefined) {
    console.log('***EBS Costs***');

    const ebsMonthlyCost = ebsReport.reduce((accumulator: number, currentValue: ebsUnattached.VolumeTypePricing) => {
      console.log(`Volume type: ${currentValue.volumeType} => ${parseFloat(currentValue.pricePerGB) * currentValue.sizeInGB}$`);

      return accumulator + (parseFloat(currentValue.pricePerGB) * currentValue.sizeInGB);
    }, 0);
   
    console.log(`Total monthly cost: ${ebsMonthlyCost}$`);
  }
})();