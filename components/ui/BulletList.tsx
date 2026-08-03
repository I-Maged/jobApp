type Props = {
  title: string;
  items: string[];
};

export function BulletList({ title, items }: Props) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-6 text-text-secondary">
        {items.map((item, index) => (
          <li key={`${item}-${index}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
