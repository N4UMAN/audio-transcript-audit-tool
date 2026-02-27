
//@ts-ignore
function getClientSideVars() {
    const props = PropertiesService.getScriptProperties().getProperties();
    return {
        API_BASE_URL: props.API_BASE_URL,
        DEBUG_MODE: props.DEBUG_MODE === 'true',
        API_KEY: props.API_KEY,
        VERSION: '0.0.0'
    }
}


// const App = () => {
//     const [config, setConfig] = useState<{ API_BASE_URL: string } | null>(null);

//     useEffect(() => {
//         // Now returns only non-sensitive data
//         server.getClientSideVars()
//             .then((data) => setConfig(data))
//             .catch((error) => console.log("Init failed:", error));
//     }, []);

//     if (!config) {
//         return <Loader message='Initializing...' />;
//     }

//     return <AuditManager />;
// }

// const AuditManager = () => {
//     // useAudit no longer takes config/keys!
//     const { status, auditData, ...rest } = useAudit();
//     // ...
// }
