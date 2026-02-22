
interface LoaderProps {
    message?: string
}

const Loader = ({ message = "Loading..." }: LoaderProps) => {
    return (
        <div className="flex flex-col items-center justify-center h-full space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            <p className="text-sm font-medium text-gray-600">{message}</p>
        </div>
    );
}

export default Loader
