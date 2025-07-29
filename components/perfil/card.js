import React from 'react';

const Card = React.forwardRef(({ className = '', ...props }, ref) => {
  const classes = [
    'rounded-lg border bg-card text-card-foreground shadow-sm',
    className
  ]
    .filter(Boolean)
    .join(' ');

  return <div ref={ref} className={classes} {...props} />;
});
Card.displayName = 'Card';

const CardHeader = React.forwardRef(({ className = '', ...props }, ref) => {
  const classes = [
    'flex flex-col space-y-1.5 p-6',
    className
  ]
    .filter(Boolean)
    .join(' ');

  return <div ref={ref} className={classes} {...props} />;
});
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef(({ className = '', ...props }, ref) => {
  const classes = [
    'text-2xl font-semibold leading-none tracking-tight',
    className
  ]
    .filter(Boolean)
    .join(' ');

  return <h3 ref={ref} className={classes} {...props} />;
});
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef(({ className = '', ...props }, ref) => {
  const classes = [
    'text-sm text-muted-foreground',
    className
  ]
    .filter(Boolean)
    .join(' ');

  return <p ref={ref} className={classes} {...props} />;
});
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef(({ className = '', ...props }, ref) => {
  const classes = [
    'p-6 pt-0',
    className
  ]
    .filter(Boolean)
    .join(' ');

  return <div ref={ref} className={classes} {...props} />;
});
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef(({ className = '', ...props }, ref) => {
  const classes = [
    'flex items-center p-6 pt-0',
    className
  ]
    .filter(Boolean)
    .join(' ');

  return <div ref={ref} className={classes} {...props} />;
});
CardFooter.displayName = 'CardFooter';

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
};
