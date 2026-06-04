import './Card.css';
export default function Card({ children, className = '', hover = false, padding = true, ...props }) {
  return (
    <div className={`card ${hover ? 'card-hover' : ''} ${!padding ? 'card-no-pad' : ''} ${className}`} {...props}>
      {children}
    </div>
  );
}
