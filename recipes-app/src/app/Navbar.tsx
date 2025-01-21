'use client';

import { useDisclosure } from '@mantine/hooks';
import { Burger, Menu, Button, Container,Title } from '@mantine/core';
import { IconHome, IconPlus, IconHeart } from '@tabler/icons-react';
import { useState } from 'react';
import Link from 'next/link';

export default function Navbar({ colorScheme, toggleColorScheme }: { colorScheme: string, toggleColorScheme: () => void }) {
  const [opened, { toggle }] = useDisclosure();

  return (
    <div className="navbar">
      <Container size="lg">
        <div className="navbar-content">
          {/* Logo */}
          <Link href="/" className="nav-logo">
            <Title size="xl" >Recipes App</Title>
          </Link>

          {/* Burger Menu for mobile only */}
          <div className="burger-menu">
            <Menu
              opened={opened}
              onChange={toggle}
              position="bottom-end"
            >
              <Menu.Target>
                <Burger
                  opened={opened}
                  onClick={toggle}
                  aria-label="Toggle navigation"
                  size="lg"
                />
              </Menu.Target>

              {/* Dropdown Menu for mobile view */}
              <Menu.Dropdown>
                <Menu.Item component={Link} href="/" leftSection={<IconHome size={14} />}>
                  Home
                </Menu.Item>
                <Menu.Item component={Link} href="/recipes/add" leftSection={<IconPlus size={14} />}>
                  Add Recipe
                </Menu.Item>
                <Menu.Item component={Link} href="/favorites" leftSection={<IconHeart size={14} />}>
                  Favorites
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item onClick={toggleColorScheme}>
                  {colorScheme === 'light' ? 'Switch to Dark' : 'Switch to Light'}
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </div>

          {/* Desktop Navigation Links */}
          <div className="nav-links">
            <Link href="/" className="nav-link">Home</Link>
            <Link href="/recipes/add" className="nav-link">Add Recipe</Link>
            <Link href="/favorites" className="nav-link">Favorites</Link>
            <Button variant="subtle" onClick={toggleColorScheme}>
              {colorScheme === 'light' ? 'Dark' : 'Light'}
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
}
