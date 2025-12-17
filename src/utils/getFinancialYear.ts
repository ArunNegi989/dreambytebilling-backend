export const getFinancialYear = (date = new Date()): string => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  // FY starts from April
  if (month >= 4) {
    return `${year.toString().slice(-2)}${(year + 1)
      .toString()
      .slice(-2)}`;
  } else {
    return `${(year - 1).toString().slice(-2)}${year
      .toString()
      .slice(-2)}`;
  }
};
