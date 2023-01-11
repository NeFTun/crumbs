import * as ec2 from "./aws/ec2";
import * as ebs from "./aws/ebs";
import * as elasticache from "./aws/elasticache";
import * as elbClassic from "./aws/elbClassic";
import * as elbV2 from "./aws/elbV2";
import * as rds from "./aws/rds";

// According to AWS monthly calculations 730 hours is a month
const HRS_IN_MONTH = 730;
const REGION = 'us-east-1';

(async () => {
  let totalCost = 0;

  // EC2
  const ec2Report = await ec2.getReport(REGION);
  if (ec2Report !== undefined) {
    console.log('***EC2 Costs***');

    const ec2Cost = ec2Report.reduce((accumulator: number, value: ec2.InstanceTypePricing) => {
      const totalPrice = value.count * parseFloat(value.pricePerInstance) * HRS_IN_MONTH;

      console.log(`Instance type: ${value.instanceType}, Instance count: ${value.count} => ${totalPrice}$`);

      return accumulator + (totalPrice);
    }, 0);

    console.log(`Total monthly cost: ${ec2Cost}$`);

    totalCost += ec2Cost;
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

    totalCost += ebsMonthlyCost;
  }

  // ELB classic
  const elbReport = await elbClassic.getReport(REGION);
  if (elbReport !== undefined) {
    const elbMonthlyCost = parseFloat(elbReport.price) * elbReport.numberOfELBs * HRS_IN_MONTH;

    console.log('***ELB Classic Costs***');
    console.log(`Total monthly cost: ${elbMonthlyCost}$`);

    totalCost += elbMonthlyCost;
  }

  // ELB V2
  const elbV2Report = await elbV2.getReport(REGION);
  if (elbV2Report !== undefined) {
    const elbV2MonthlyCost = parseFloat(elbV2Report.price) * elbV2Report.numberOfELBs * HRS_IN_MONTH;

    console.log('***ELB V2 Costs***');
    console.log(`Total monthly cost: ${elbV2MonthlyCost}$`);

    totalCost += elbV2MonthlyCost;
  }

  // RDS
  const rdsReport = await rds.getReport(REGION);
  if (rdsReport?.length) {
    console.log('***RDS Costs***');

    const rdsCost = rdsReport.reduce((accumulator: number, value: rds.DBPricing) => {
      const monthlyPrice = value.price * HRS_IN_MONTH;

      console.log (`Instance id: ${value.DBInstanceId} => ${monthlyPrice}$`);

      return accumulator + monthlyPrice;
    }, 0);

    console.log(`Total monthly cost: ${rdsCost}$`);

    totalCost += rdsCost;
  }

  // Elasticache
  const elasticacheReport = await elasticache.getReport(REGION);
  if (elasticacheReport?.length) {
    console.log('***Elasticache Costs***');

    const elasticacheCost = elasticacheReport.reduce((accumulator: number, value: elasticache.ClusterPricing) => {
      const clusterPrice = value.numberOfNodes * parseFloat(value.pricePerNode) * HRS_IN_MONTH;

      console.log (`Engine: ${value.engine}, Instance type: ${value.instanceType}, Nodes: ${value.numberOfNodes} => ${clusterPrice}$`);

      return accumulator + clusterPrice;
    }, 0);

    console.log(`Total monthly cost: ${elasticacheCost}$`);

    totalCost += elasticacheCost;
  }

  console.log(`************* Total AWS cost: ${totalCost}$ *************`);
})();