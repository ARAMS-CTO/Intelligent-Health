import re
from typing import List

class TextSplitter:
    """
    Utility for splitting text into overlapping chunks for RAG.
    """
    
    @staticmethod
    def recursive_split(text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
        """
        Splits text recursively by separators (paragraphs, newlines, sentences).
        """
        if not text: return []
        
        separators = ["\n\n", "\n", ". ", " ", ""]
        final_chunks = []
        
        # Simple recursive strategy
        def _split(current_text: str, current_seps: List[str]):
            if len(current_text) <= chunk_size:
                final_chunks.append(current_text)
                return

            if not current_seps:
                # No more separators, force split
                for i in range(0, len(current_text), chunk_size - overlap):
                    final_chunks.append(current_text[i:i + chunk_size])
                return

            sep = current_seps[0]
            next_seps = current_seps[1:]
            
            # Split by current separator
            if sep == "":
                # Character split
                splits = list(current_text)
                sep = "" # Ensure re-join works or logic handles it
            else:
                splits = current_text.split(sep)
            
            # Re-assemble nicely
            current_chunk = []
            current_len = 0
            
            for s in splits:
                s_len = len(s)
                if current_len + s_len > chunk_size:
                    # Flush current chunk
                    if current_chunk:
                        joined = sep.join(current_chunk)
                        if len(joined) > chunk_size:
                            # If single chunk is too big, recurse
                            _split(joined, next_seps)
                        else:
                            final_chunks.append(joined)
                        
                        # Start new chunk, keeping some overlap if possible (simplified here: just reset)
                        current_chunk = []
                        current_len = 0
                
                current_chunk.append(s)
                current_len += s_len
            
            # Flush remainder
            if current_chunk:
                joined = sep.join(current_chunk)
                if len(joined) > chunk_size:
                    _split(joined, next_seps)
                else:
                    final_chunks.append(joined)

        _split(text, separators)
        return final_chunks

    @staticmethod
    def semantic_cleanup(text: str) -> str:
        """Remove excess whitespace/noise."""
        return re.sub(r'\s+', ' ', text).strip()
