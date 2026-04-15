export function sortObjectKeys(object) {
    if (typeof object != 'object' || object == null) return object;
    if (Array.isArray(object)) return object.map(sortObjectKeys);

    return Object.keys(object).sort().reduce((acc, key) => {
        acc[key] = sortObjectKeys(object[key]);
        return acc;
    }, {});
}

export function prepareMessage(header, payload) {
    const dataToSign = {
        ...header,
        data: payload
    };

    const sortedData = sortObjectKeys(dataToSign);
    return JSON.stringify(sortedData);
}

export const privateFetch = async (url, options = {}, getIdentityToken) => {
    const token = await getIdentityToken();
    return fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
};