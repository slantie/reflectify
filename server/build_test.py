import sys
import compileall

def test_build():
    # Compile all Python files
    if not compileall.compile_dir(".", force=True):
        sys.exit(1)
    
    # Import main to test for import errors
    try:
        import server.mainflask as mainflask
        print("Build test successful!")
    except Exception as e:
        print(f"Build test failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    test_build()
