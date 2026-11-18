import { AnimatePresence, motion } from 'motion/react'
import { Icon } from '../components/Icon'

export function WorldMessage({ message, dismiss }: { message: string | undefined; dismiss: () => void }) {
  return (
    <div className="world-message-position" aria-live="polite">
      <AnimatePresence initial={false}>
        {message && (
          <motion.div key={message} className="world-message" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Icon name="sprout" size={19} />
            <span>{message}</span>
            <button type="button" className="icon-button" aria-label="Dismiss notice" onClick={dismiss}><Icon name="close" size={17} /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
