

function getClientSideVars() {
    const props = PropertiesService.getScriptProperties().getProperties();
    return {
        API_BASE_URL: props.API_BASE_URL,
        DEBUG_MODE: props.DEBUG_MODE === 'true',
        VERSION: '0.0.0'
    }
}