import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';

export function NavMain({ groupedItems = [] }: { groupedItems: { group: string; label: string; items: NavItem[] }[] }) {
    const page = usePage();
    return (
        <>
            {groupedItems.map((group) => (
                <SidebarGroup key={group.group} className="px-2 py-0">
                    <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                    <SidebarMenu>
                        {group.items.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton asChild isActive={item.url === page.url}>
                                    <Link 
                                        href={item.url} 
                                        method={item.method || 'get'} 
                                        as={item.method && item.method !== 'get' ? 'button' : 'a'}
                                        prefetch={!item.method || item.method === 'get'}
                                    >
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            ))}
        </>
    );
}
