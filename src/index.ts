import * as ec2 from "./aws/ec2";
import * as ebs from "./aws/ebs";
import * as elbClassic from "./aws/elbClassic";
import * as elbV2 from "./aws/elbV2";
import * as rds from "./aws/rds";

// According to AWS monthly calculations 730 hours is a month
const HRS_IN_MONTH = 730;
const REGION = 'us-east-1';

(async () => {
  // EC2
  const ec2Report = await ec2.getReport(REGION);
  if (ec2Report !== undefined) {
    console.log('***EC2 Costs***');

    const ec2HourlyCost = ec2Report.reduce((accumulator: number, currentValue: ec2.InstanceTypePricing) => {
      const totalPrice = parseFloat(currentValue.pricePerInstance) * currentValue.count;

      console.log(`Instance type: ${currentValue.instanceType} => ${totalPrice * HRS_IN_MONTH}$`);

      return accumulator + (totalPrice);
    }, 0);

    console.log(`Total monthly cost: ${ec2HourlyCost * HRS_IN_MONTH}$`);
  }

  // EBS
  const ebsReport = await ebs.getReport(REGION);
  if (ebsReport !== undefined) {
    console.log('***EBS Costs***');

    const ebsMonthlyCost = ebsReport.reduce((accumulator: number, currentValue: ebs.VolumeTypePricing) => {
      const totalPrice = parseFloat(currentValue.pricePerGB) * currentValue.sizeInGB;

      console.log(`Volume type: ${currentValue.volumeType} => ${totalPrice}$`);

      return accumulator + (totalPrice);
    }, 0);

    console.log(`Total monthly cost: ${ebsMonthlyCost}$`);
  }

  // ELB classic
  const elbReport = await elbClassic.getReport(REGION);
  if (elbReport !== undefined) {
    console.log('***ELB Classic Costs***');
    console.log(`Total monthly cost: ${parseFloat(elbReport.price) * elbReport.numberOfELBs * HRS_IN_MONTH}$`);
  }

  // ELB V2
  const elbV2Report = await elbV2.getReport(REGION);
  if (elbV2Report !== undefined) {
    console.log('***ELB V2 Costs***');
    console.log(`Total monthly cost: ${parseFloat(elbV2Report.price) * elbV2Report.numberOfELBs * HRS_IN_MONTH}$`);
  }

  // RDS
  const rdsReport = await rds.getReport(REGION);
  if (rdsReport?.length) {
    console.log('***RDS Costs***');

    const rdsHourlyCost = rdsReport.reduce((accumulator: number, value: rds.DBPricing) => {
      console.log (`Instance id: ${value.DBInstanceId} => ${value.price * HRS_IN_MONTH}$`);

      return accumulator + value.price;
    }, 0);

    console.log(`Total monthly cost: ${rdsHourlyCost * HRS_IN_MONTH}$`);
  }
})();