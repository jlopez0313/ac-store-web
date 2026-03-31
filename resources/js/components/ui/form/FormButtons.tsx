import { Button } from '../button';

type Labels = {
    cancel?: string;
    submit?: string;
};

type ButtonOptions = {
    cancel?: boolean;
    submit?: boolean;
};

type Props = {
    processing: boolean;
    buttons?: ButtonOptions;
    labels?: Labels;
    reset: () => void;
    submitDisabled?: boolean;
}

export const FormButtons = ({
    processing,
    buttons = { cancel: true, submit: true },
    labels = { cancel: 'Cancelar', submit: 'Guardar' },
    reset,
    submitDisabled = false
}: Props) => {
    return (
        <div className="mt-4 flex items-center justify-end">
            {
                buttons.cancel &&
                <Button variant={'outline'} loading={processing} className="mx-4 ms-4 flex gap-2" type="button" onClick={() => reset()}>
                    {labels.cancel}
                </Button>
            }

            {
                buttons.submit &&
                <Button type="submit" loading={processing} disabled={submitDisabled}>
                    {labels.submit}
                </Button>
            }

        </div>
    )
}
