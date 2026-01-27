'use client';
import React, { useState } from 'react';
import { DEFAULT_USER_PLACE } from '@/constants/locations';
import LocationAutocomplete from '@/components/LocationAutocomplete';
import { useFetchDestinations } from '@/hooks/useFetchDestinations';
import { DistanceSlider } from '../../components/DistanceSlider';
import { DestinationCard } from '@/components/DestinationCard';
import { Place } from '@/types/Place';
import { Destination } from '../../types/Destination';
import { Modal } from '@/components/Modal';
import useLocalStorage from '@/hooks/useLocalStorage';

export default function LetsGo() {
  const toggleActivity = (activity: string) => {
    setSelectedActivities((prevActivities) => {
      if (prevActivities.includes(activity)) {
        return prevActivities.filter((a) => a !== activity);
      } else {
        return [...prevActivities, activity];
      }
    });
  };
  const activities = [
    'take photos',
    'eat',
    'drink',
    'read',
    'learn',
    'explore',
    'shop',
  ];
  const [selectedLocation, setSelectedLocation] =
    useState<Place>(DEFAULT_USER_PLACE);
  const [selectedDestinations, setSelectedDestinations] = useState<
    Destination[]
  >([]);
  const [maxDistance, setMaxDistance] = useState(10);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([
    activities[0],
  ]);
  const { fetchDestinations, isLoading, destinations, isDoneLoading } =
    useFetchDestinations();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [randomlySelectedDestination, setRandomlySelectedDestination] =
    useLocalStorage<{ destination: Destination; timestamp: number } | null>(
      'randomlySelectedDestination',
      null
    );
  const timeStampIsFromToday =
    randomlySelectedDestination?.timestamp &&
    Date.now() - randomlySelectedDestination.timestamp < 1000 * 60 * 60 * 24;

  const generateRandomDestination = () => {
    const randomIndex = Math.floor(Math.random() * destinations.length);
    const randomDestination = destinations[randomIndex];
    setRandomlySelectedDestination({
      destination: randomDestination as Destination,
      timestamp: Date.now(),
    });
  };

  return timeStampIsFromToday ? (
    <div className="flex flex-col items-center justify-center">
      <div className="text-5xl font-bold m-4">You are going to</div>
      <DestinationCard
        destination={randomlySelectedDestination?.destination}
        onSelect={() => {}}
        isSelected={false}
        showMapByDefault={true}
      />
    </div>
  ) : (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center text-primary">
        Let&apos;s Go
      </h1>

      <section className="mb-8 space-y-4 text-primary">
        <p>
          Sometimes you just want to go somewhere and don&apos;t know where to
          go. Sometimes we get caught wandering around the blockbuster longer
          than a movie&apos;s runtime. Sometimes being able to do everything
          makes it hard to do anything.
        </p>
        <p>
          This tool was made to help make a choice and{' '}
          <span className="text-accent font-bold font-tenon-bold">
            move on with your life
          </span>
          .
        </p>
        <p>
          A user can generate a list of locations based on their preferences and
          then use the picker to randomly select a{' '}
          <span className="text-accent font-bold font-tenon-bold">
            single location
          </span>{' '}
          from the deck.
        </p>
        <p className="italic">
          This tool is not complete, but is already{' '}
          <span className="text-accent font-bold font-tenon-bold">
            useful for me
          </span>{' '}
          so I thought I&apos;d share as I build it out.
        </p>
      </section>
      <div>
        I am in{' '}
        <LocationAutocomplete setSelectedLocation={setSelectedLocation} />
      </div>
      <div>I want to</div>
      <div className="flex flex-wrap gap-2">
        {activities.map((activity) => (
          <div
            className={`border border-primary rounded-full p-2 cursor-pointer w-fit text-primary ${
              selectedActivities.includes(activity)
                ? 'bg-primary text-white'
                : 'bg-white'
            }`}
            key={activity}
            onClick={() => {
              toggleActivity(activity);
            }}
          >
            {activity}
          </div>
        ))}
      </div>
      <DistanceSlider
        maxDistance={maxDistance}
        onChange={(e) => setMaxDistance(Number(e.target.value))}
      />
      <button
        className="border-2 border-primary text-primary mt-8 p-2"
        onClick={() =>
          fetchDestinations(
            {
              lat: parseFloat(selectedLocation.lat),
              lon: parseFloat(selectedLocation.lon),
            },
            selectedActivities,
            maxDistance
          )
        }
      >
        Generate Ideas
      </button>
      {isDoneLoading && <div>Select the ones that sound interesting</div>}
      {isLoading && <div>Loading...</div>}
      {destinations && destinations.length > 0 && (
        <>
          <div>
            {destinations.map((destination) => {
              if (!destination?.coords?.lat || !destination?.coords?.lon) return null;
              const isSelected = selectedDestinations.some(
                (d) => d.name === destination.name
              );

              return (
                <div
                  key={`${destination.coords.lat}-${destination.coords.lon}`}
                >
                  <DestinationCard
                    destination={destination as Destination}
                    onSelect={() => {
                      if (isSelected) {
                        setSelectedDestinations(
                          selectedDestinations.filter(
                            (d) => d.name !== destination.name
                          )
                        );
                      } else {
                        setSelectedDestinations([
                          ...selectedDestinations,
                          destination as Destination,
                        ]);
                      }
                    }}
                    isSelected={isSelected}
                  />
                </div>
              );
            })}
          </div>
          <button
            className="border-2 border-primary text-primary mt-8 p-2"
            onClick={() => setIsModalOpen(true)}
          >
            Okay I&apos;m ready!
          </button>
        </>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={() => {
          generateRandomDestination();
          setIsModalOpen(false);
        }}
        title="Are you ready?"
      >
        <p>
          So- this whole thing kind of only works if you actually want to just
          go. <br />
          If you aren&apos;t ready to go, it all becomes even more meaningless.
        </p>
      </Modal>
    </div>
  );
}
