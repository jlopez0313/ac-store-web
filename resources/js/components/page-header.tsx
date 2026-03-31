interface PageHeaderProps {
    title: string;
    description?: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
    return (
        <div className="flex items-center gap-4 pt-2">
            <div>
                <h1 className="text-2xl font-bold">{title}</h1>
                {description && (
                    <p className="text-muted-foreground text-sm">{description}</p>
                )}
            </div>
        </div>
    );
}
