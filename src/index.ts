import * as ec2 from "./ec2";
import * as ebs from "./ebs";
import * as elbClassic from "./elbClassic";
import * as elbV2 from "./elbV2";

const REGION = 'us-east-1';

(async () => {
  // EC2
  const ec2Report = await ec2.getReport(REGION);
  if (ec2Report !== undefined) {
    console.log('***EC2 Costs***');

    const ec2HourlyCost = ec2Report.reduce((accumulator: number, currentValue: ec2.InstanceTypePricing) => {
      console.log(`Instance type: ${currentValue.instanceType} => ${parseFloat(currentValue.pricePerInstance) * currentValue.count}$`);

      return accumulator + (parseFloat(currentValue.pricePerInstance) * currentValue.count);
    }, 0);

    console.log(`Total monthly cost: ${ec2HourlyCost * 24 * 30}$`);
  }

  // EBS
  const ebsReport = await ebs.getReport(REGION);
  if (ebsReport !== undefined) {
    console.log('***EBS Costs***');

    const ebsMonthlyCost = ebsReport.reduce((accumulator: number, currentValue: ebs.VolumeTypePricing) => {
      console.log(`Volume type: ${currentValue.volumeType} => ${parseFloat(currentValue.pricePerGB) * currentValue.sizeInGB}$`);

      return accumulator + (parseFloat(currentValue.pricePerGB) * currentValue.sizeInGB);
    }, 0);

    console.log(`Total monthly cost: ${ebsMonthlyCost}$`);
  }

  // ELB classic
  const elbReport = await elbClassic.getReport(REGION);
  if (elbReport !== undefined) {
    console.log('***ELB Classic Costs***');
    console.log(`Total monthly cost: ${parseFloat(elbReport.price) * elbReport.numberOfELBs * 24 * 30}$`);
  }

  // ELB V2
  const elbV2Report = await elbV2.getReport(REGION);
  if (elbV2Report !== undefined) {
    console.log('***ELB V2 Costs***');
    console.log(`Total monthly cost: ${parseFloat(elbV2Report.price) * elbV2Report.numberOfELBs * 24 * 30}$`);
  }
})();