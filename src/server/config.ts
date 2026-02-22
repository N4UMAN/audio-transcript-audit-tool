
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