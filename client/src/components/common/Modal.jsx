import './Modal.css';

export default function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="btn-delete" onClick={onClose}>
            ✖
          </button>
        </div>
        <div className='modal-children'>{children}</div>
      </div>
    </div>
  );
}