def timeout_handler():
    max_retries = 3
    for i in range(max_retries):
        try:
            pass  # network call
        except Exception:
            pass
