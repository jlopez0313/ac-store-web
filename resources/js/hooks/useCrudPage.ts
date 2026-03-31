import { handleProcessing } from '@/bootstrap';
import { confirmDialog, showAlert } from '@/plugins/sweetalert';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useState } from 'react';

export const useCrudPage = (lista: any, destroyFn: any, _id: number | null = null) => {
    const [id, setId] = useState<number | null>(_id);
    const [show, setShow] = useState(false);
    const [processing, setProcessing] = useState(false);

    const onSetItem = (_id: number) => {
        setId(_id);
        onToggleModal(true);
    };

    const onToggleModal = (isShown: boolean) => {
        if (!isShown) {
            setId(null);
        }
        setShow(isShown);
    };

    const onReload = (page: number | null = null, perPage: number | null = null, deleted: boolean = false) => {
        const params = new URLSearchParams(window.location.search);
        
        if (page !== null) {
            params.set('page', page.toString());
        } else if (lista) {
            // Support both standard paginators and those wrapped in a 'meta' key
            const meta = lista.meta || lista;
            const { current_page, total, per_page } = meta;
            
            if (current_page !== undefined && total !== undefined && per_page !== undefined) {
                const lastPage = Math.max(1, Math.ceil((total - (deleted ? 1 : 0)) / per_page));
                const targetPage = Math.min(current_page, lastPage);
                params.set('page', targetPage.toString());
            }
        }

        if (perPage !== null) {
            params.set('per_page', perPage.toString());
        }

        router.visit(`${window.location.pathname}?${params.toString()}`, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const onList = async (indexFn: any, params: Record<string, any>) => {
        const { data } = await axios.get(indexFn().url, params);
        return data.data;
    };

    const onGetItem = async (showFn: any, params: Record<string, any>, queryParams: Record<string, any> = {}) => {
        const { data } = await axios.get(showFn(params).url, queryParams);
        return data.data;
    };

    const onStore = async (storeFn: any, updateFn: any, data: any, multimedia: boolean = false, onError: any = null) => {
        setProcessing(true);

        try {
            let item = null;
            const useMultimedia = multimedia === true;
            let payload = data;

            if (useMultimedia && !(data instanceof FormData)) {
                payload = new FormData();
                Object.keys(data).forEach(key => {
                    if (data[key] !== null && data[key] !== undefined) {
                        payload.append(key, data[key]);
                    }
                });
            }

            if (id && updateFn) {
                if (useMultimedia) {
                    payload.append('_method', 'PUT');
                    item = await axios.post(updateFn({ id }).url, payload);
                } else {
                    item = await axios.put(updateFn({ id }).url, payload);
                }
            } else {
                item =  await axios.post(storeFn().url, payload);
            }

            await showAlert('success', 'Registro guardado exitosamente!');

            setShow( false )
            return item;

        } catch (error: any) {
            console.error('Error saving item:', error);
            
            if (onError && error.response?.status === 422) {
                onError(error);
            }

            let message = 'Error interno al guardar...';
            
            if (error.response) {
                if (error.response.status === 403) {
                    message = error.response.data.message || 'Has alcanzado el límite de tu plan.';
                } else if (error.response.status === 422) {
                    // Validation errors
                    const validationErrors = error.response.data.errors;
                    if (validationErrors) {
                        message = Object.values(validationErrors).flat().join('\n');
                    } else {
                        message = error.response.data.message || 'Error de validación';
                    }
                } else if (error.response.data && error.response.data.message) {
                    message = error.response.data.message;
                }
            }
            
            throw new Error(message);
        } finally {
            setProcessing(false);
        }
    };

    const onTrash = async (_id: number) => {
        const result = await confirmDialog({
            title: '¿Estás seguro?',
            text: '¡No podrás revertir esto!',
            icon: 'warning',
        });

        if (result.isConfirmed) {
            setProcessing(true);
            try {
                const url = destroyFn({ id: _id }).url;
                await axios.delete(url);
                
                await showAlert('success', 'Registro eliminado exitosamente!');
                onReload(null, null, true);
            } catch (error: any) {
                console.error('Error during deletion:', error);
                
                let message = 'Error al eliminar.';
                if (error.response?.data?.message) {
                    message = error.response.data.message;
                }
                
                showAlert('error', message);
            } finally {
                setProcessing(false);
            }
        }
    };

    const onBack = () => {
        window.history.back();
    };

    useEffect(() => {
        handleProcessing(setProcessing);
    }, [])

    useEffect(() => {
        setId(_id);
    }, [_id])

    return {
        id,
        show,
        processing,
        onList,
        onSetItem,
        onToggleModal,
        onReload,
        onTrash,
        onStore,
        onGetItem,
        onBack,
    };
};
