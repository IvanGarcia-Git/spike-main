import React from 'react';

const Table = React.forwardRef(({ className = '', ...props }, ref) => {
  const classes = ['w-full caption-bottom text-sm', className].filter(Boolean).join(' ');
  return (
    <div className="relative w-full overflow-auto">
      <table ref={ref} className={classes} {...props} />
    </div>
  );
});
Table.displayName = 'Table';

const TableHeader = React.forwardRef(({ className = '', ...props }, ref) => {
  const classes = ['[&_tr]:border-b', className].filter(Boolean).join(' ');
  return <thead ref={ref} className={classes} {...props} />;
});
TableHeader.displayName = 'TableHeader';

const TableBody = React.forwardRef(({ className = '', ...props }, ref) => {
  const classes = ['[&_tr:last-child]:border-0', className].filter(Boolean).join(' ');
  return <tbody ref={ref} className={classes} {...props} />;
});
TableBody.displayName = 'TableBody';

const TableFooter = React.forwardRef(({ className = '', ...props }, ref) => {
  const classes = ['border-t bg-muted/50 font-medium [&>tr]:last:border-b-0', className]
    .filter(Boolean)
    .join(' ');
  return <tfoot ref={ref} className={classes} {...props} />;
});
TableFooter.displayName = 'TableFooter';

const TableRow = React.forwardRef(({ className = '', ...props }, ref) => {
  const classes = [
    'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return <tr ref={ref} className={classes} {...props} />;
});
TableRow.displayName = 'TableRow';

const TableHead = React.forwardRef(({ className = '', ...props }, ref) => {
  const classes = [
    'h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return <th ref={ref} className={classes} {...props} />;
});
TableHead.displayName = 'TableHead';

const TableCell = React.forwardRef(({ className = '', ...props }, ref) => {
  const classes = ['p-4 align-middle [&:has([role=checkbox])]:pr-0', className]
    .filter(Boolean)
    .join(' ');
  return <td ref={ref} className={classes} {...props} />;
});
TableCell.displayName = 'TableCell';

const TableCaption = React.forwardRef(({ className = '', ...props }, ref) => {
  const classes = ['mt-4 text-sm text-muted-foreground', className].filter(Boolean).join(' ');
  return <caption ref={ref} className={classes} {...props} />;
});
TableCaption.displayName = 'TableCaption';

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
};
