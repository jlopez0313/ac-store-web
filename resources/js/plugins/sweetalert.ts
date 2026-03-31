import Swal from 'sweetalert2';

const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
    },
});

type errorType = 'error' |'success' | 'warning'
export const showAlert = (type: errorType, message: string) => {
    Toast.fire({
        icon: type,
        title: message,
    });
};

export const confirmDialog = (options: any) => {
    return Swal.fire({
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, confirmo',
        cancelButtonText: 'No, cancelar',
        ...options,
    });
};

export default Swal;
