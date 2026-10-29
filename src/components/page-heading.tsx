export function PageHeading({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-heading flex justify-between items-center gap-[25px] mb-8 max-md:flex-col max-md:items-start max-md:gap-5 max-md:mb-[26px]">
      <div>
        <h1 className="text-[clamp(25px,2.7vw,38px)] font-extrabold tracking-[-0.04em] leading-[1.25] text-foreground max-md:text-[27px]">
          {title}
        </h1>
        <p className="mt-2.5 max-w-[65ch] text-xs text-secondary leading-normal">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}
