type SectionHeaderProps = {
  title: string;
  description?: string;
  align?: "left" | "center";
};

export function SectionHeader({ title, description, align = "left" }: SectionHeaderProps) {
  return (
    <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <h2 className="text-3xl font-semibold tracking-normal text-white sm:text-4xl">{title}</h2>
      {description ? (
        <p className="mt-4 text-base leading-7 text-zinc-300 sm:text-lg">{description}</p>
      ) : null}
    </div>
  );
}
