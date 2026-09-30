const storageKey = (userId) => `snitch.orderReceipts.${userId}`;

export const getOrderReceipts = (userId) => {
  if (!userId) return [];

  try {
    const receipts = JSON.parse(window.localStorage.getItem(storageKey(userId)) ?? "[]");
    return Array.isArray(receipts) ? receipts : [];
  } catch {
    return [];
  }
};

export const saveOrderReceipt = (userId, receipt) => {
  if (!userId || !receipt?._id) return;

  const receipts = getOrderReceipts(userId);
  const nextReceipts = [receipt, ...receipts.filter((order) => order._id !== receipt._id)];

  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(nextReceipts));
  } catch {
    return;
  }

  return nextReceipts;
};