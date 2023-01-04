import * as ec2Underutilized from "./ec2Underutilized";

(async () => {
  const report = await ec2Underutilized.getReport();

  if (report !== undefined) {
    const ec2HourlyCost = report.reduce((accumulator: number, currentValue: ec2Underutilized.InstanceTypePricing) => {
      return accumulator + (parseFloat(currentValue.pricePerInstance) * currentValue.count);
    }, 0)
   
    console.log(`Total monthly cost: ${ec2HourlyCost * 24 * 30}$`);
  }
})();