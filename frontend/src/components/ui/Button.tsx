export function Button({
    children,
    ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            className="bg-highlight1-main text-white px-4 py-2 rounded hover:bg-highlight1-dark transition-colors"
            {...props}
        >
            {children}
        </button>
    );
}
