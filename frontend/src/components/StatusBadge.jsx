const STYLES = {
  pending: "bg-marigold-tint text-[#8a5a00]",
  accepted: "bg-sage-tint text-sage",
  declined: "bg-rose-tint text-rose",
};
const LABEL = { pending: "Waiting for reply", accepted: "Accepted", declined: "Declined" };

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${STYLES[status] || STYLES.pending}`}>
      {LABEL[status] || status}
    </span>
  );
}
